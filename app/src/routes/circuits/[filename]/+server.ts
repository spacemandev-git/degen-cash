import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serve compiled Arcium circuits (.arcis files) from the build directory
 * This allows the app to host its own circuits at app-domain.com/circuits/*
 *
 * Example URLs:
 *   /circuits/deposit_testnet.arcis
 *   /circuits/transfer_testnet.arcis
 *   /circuits/withdraw_testnet.arcis
 */
export const GET: RequestHandler = async ({ params }) => {
	const { filename } = params;

	// Validate filename (only allow .arcis files, prevent directory traversal)
	if (!filename || !filename.endsWith('.arcis')) {
		throw error(400, 'Invalid filename. Only .arcis files are allowed.');
	}

	// Prevent directory traversal attacks
	if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
		throw error(400, 'Invalid filename.');
	}

	// Build path to circuit file
	// In production, this should be relative to the app root
	const buildDir = path.join(process.cwd(), '..', 'build');
	const filePath = path.join(buildDir, filename);

	// Check if file exists
	if (!fs.existsSync(filePath)) {
		throw error(404, `Circuit file not found: ${filename}`);
	}

	try {
		// Read file as binary buffer
		const fileBuffer = fs.readFileSync(filePath);

		// Return file with appropriate headers
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Length': fileBuffer.length.toString(),
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
				'Content-Disposition': `inline; filename="${filename}"`
			}
		});
	} catch (err) {
		console.error('Error reading circuit file:', err);
		throw error(500, 'Failed to read circuit file');
	}
};
