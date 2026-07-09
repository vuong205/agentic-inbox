// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Email sending via Cloudflare Email Service binding.
 *
 * Uses the `send_email` Worker binding (`env.EMAIL.send()`) to send emails.
 *
 * See: https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
 

export interface SendEmailParams {
	to: string | string[];
	from: string | { email: string; name: string };
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | { email: string; name: string };
	attachments?: {
		content: string; // base64 encoded
		filename: string;
		type: string;
		disposition: "attachment" | "inline";
		contentId?: string;
	}[];
	headers?: Record<string, string>;
}

/**
 * Send an email using the Cloudflare Email Service binding.
 *
 * @param binding  - The `EMAIL` SendEmail binding from env
 * @param params   - Email parameters (to, from, subject, body, etc.)
 * @returns The send result with messageId
 * @throws On validation or delivery errors (error has `.code` property)
 *
export async function sendEmail(
	binding: SendEmail,
	params: SendEmailParams,
): Promise<{ messageId: string }> {
	const message: Record<string, unknown> = {
		to: params.to,
		from: params.from,
		subject: params.subject,
	};

	if (params.html) message.html = params.html;
	if (params.text) message.text = params.text;
	if (params.cc) message.cc = params.cc;
	if (params.bcc) message.bcc = params.bcc;
	if (params.replyTo) message.replyTo = params.replyTo;

	if (params.headers && Object.keys(params.headers).length > 0) {
		message.headers = params.headers;
	}

	if (params.attachments && params.attachments.length > 0) {
		message.attachments = params.attachments.map((att) => ({
			content: att.content,
			filename: att.filename,
			type: att.type,
			disposition: att.disposition,
			...(att.contentId ? { contentId: att.contentId } : {}),
		}));
	}

	const result = await binding.send(message as any);
	return { messageId: result.messageId };
}
*/


export interface ResendEmailParams {
	to: string | string[];
	from: string | { email: string; name: string };
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | string[];
	attachments?: {
		content: string; // base64 encoded string
		filename: string;
		path?: string;
		content_type?: string;
	}[];
	headers?: Record<string, string>;
}

/**
 * Gửi email sử dụng API của Resend.
 *
 * @param apiKey - API Key lấy từ tài khoản Resend của bạn (re_...)
 * @param params - Các tham số cấu hình email
 */
export async function sendEmailWithResend(
	apiKey: string,
	params: ResendEmailParams,
): Promise<{ id: string }> {
	// Chuẩn hóa định dạng 'from' theo yêu cầu của Resend ("Name <email@domain.com>")
	const fromString = typeof params.from === "string" 
		? params.from 
		: `${params.from.name} <${params.from.email}>`;

	// Chuẩn hóa các trường nhận mảng hoặc chuỗi
	const toArray = Array.isArray(params.to) ? params.to : [params.to];
	const ccArray = params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined;
	const bccArray = params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : undefined;
	const replyToArray = params.replyTo ? (Array.isArray(params.replyTo) ? params.replyTo : [params.replyTo]) : undefined;

	// Build body payload đúng chuẩn API Resend
	const body: Record<string, any> = {
		from: fromString,
		to: toArray,
		subject: params.subject,
	};

	if (params.html) body.html = params.html;
	if (params.text) body.text = params.text;
	if (ccArray) body.cc = ccArray;
	if (bccArray) body.bcc = bccArray;
	if (replyToArray) body.reply_to = replyToArray;
	if (params.headers) body.headers = params.headers;

	// Khớp cấu trúc attachment của Resend
	if (params.attachments && params.attachments.length > 0) {
		body.attachments = params.attachments.map((att) => ({
			content: att.content,
			filename: att.filename,
			contentType: att.content_type,
		}));
	}

	// Gọi HTTP API đến Resend
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const result = await response.json() as any;

	if (!response.ok) {
		throw new Error(result.message || `Resend API Error: ${response.statusText}`);
	}

	return { id: result.id };
}
