# ddns-worker

## Description

This is a Cloudflare worker that updates a Hetzner Firewall rule with the IP address of a DDNS domain name.

## Usage

Create a `wrangler.toml` file with the following contents:

```toml
[triggers]
crons = ["0 */4 * * *"]

[vars]
DOMAIN_NAME=""
PORTS=""
FIREWALL_ID=""
HETZNER_API_TOKEN=""
```

Then just deploy the worker with `wrangler deploy`.

## License

[MIT](https://choosealicense.com/licenses/mit/)
