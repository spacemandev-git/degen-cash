import { PRIVATE_SOLANA_RPC_URL } from '$env/static/private';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Backend RPC proxy to keep Solana RPC URL secret
 * Forwards all JSON-RPC requests to the configured Solana RPC endpoint
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Forward request to Solana RPC
		const response = await fetch(PRIVATE_SOLANA_RPC_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			return json(
				{ error: 'RPC request failed', status: response.status },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('RPC proxy error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
