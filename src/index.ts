export interface Env {
	DOMAIN_NAME: string;
	FIREWALL_ID: string;
	PORTS: string;
	HETZNER_API_TOKEN: string;
}

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {

		const portList = env.PORTS.split(',')

		const dns_lookup = await fetch(
		`https://cloudflare-dns.com/dns-query?name=${env.DOMAIN_NAME}&type=A`,{
			headers: {
				'accept': "application/dns-json",
			},
		});
		const dnsResponse: DnsResponse = await dns_lookup.json();

		let ipAddress = '';
		if (dnsResponse.Answer && dnsResponse.Answer.length > 0) {
				ipAddress = dnsResponse.Answer[0].data;
		}

		let rules = compileRules(ipAddress, portList)

		const time = new Date()

		const firewallInitResp = await fetch(`https://api.hetzner.cloud/v1/firewalls/${env.FIREWALL_ID}`, {
			method: 'PUT',
			headers: {
				Authorization: 'Bearer ' + env.HETZNER_API_TOKEN,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'DDNS Cloudflare' + time.toISOString()
			})
		}
		)

		if (firewallInitResp.status !== 200) {
			console.log('Failed to init Firewall: ' + await firewallInitResp.text())
			throw 'Failed to init Firewall'
		}

		const finalResp = await fetch(`https://api.hetzner.cloud/v1/firewalls/${env.FIREWALL_ID}/actions/set_rules`, {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + env.HETZNER_API_TOKEN,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				rules
			})
		});
		if (finalResp.status !== 201) {
			console.log('Failed to set Firewall Rules: ' + await finalResp.text())
			throw 'Failed to set Firewall Rules'
		}
	},
};

function compileRules(ip: string, ports: string[]) {
	const builtRules: BuiltRule[] = []


	ports.forEach(port => {
		builtRules.push({
			direction: 'in',
			source_ips: [`${ip}/32`],
			protocol: 'tcp',
			port
		})
	})

	return builtRules
}

export interface BuiltRule {
	direction: string
	source_ips: string[]
	protocol: string
	port: string
}

interface DnsResponse {
	Status: number;
	TC: boolean;
	RD: boolean;
	RA: boolean;
	AD: boolean;
	CD: boolean;
	Question: Array<{ name: string; type: number }>;
	Answer: Array<{ name: string; type: number; TTL: number; data: string }>;
}
