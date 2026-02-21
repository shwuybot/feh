import type { FastifyInstance, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

interface ErrorOptions {
  message: string;
}

type FormatInput =
  | { kind: 'error'; status: number; error: ErrorOptions }
  | { kind: 'status'; status: number; payload: unknown };

interface PluginOptions {
  /**
   * Unified formatter for both `reply.error(...)` and `reply.status(code, payload)`.
   */
  format?: (input: FormatInput) => unknown;
}

type StatusReplyMethod = FastifyReply['status'];

/*
 * Obs.: this declaration is necessary for including the methods
 * as valid methods of FastifyReply.
 */
declare module 'fastify' {
  interface FastifyReply {
    error: (status: number, options: ErrorOptions) => FastifyReply;
    status(code: number): FastifyReply;
    status(code: number, payload: unknown): FastifyReply;
  }
}

const DEFAULT_ERROR_FORMATTER = (_: number, error: ErrorOptions) => ({ error });
const DEFAULT_STATUS_FORMATTER = (_: number, payload: unknown) => payload;

function formatErrorPayload(status: number, error: ErrorOptions, options: PluginOptions) {
  if (typeof options.format !== 'undefined') {
    return options.format({ kind: 'error', status, error });
  }

  return DEFAULT_ERROR_FORMATTER(status, error);
}

function formatStatusPayload(status: number, payload: unknown, options: PluginOptions) {
  if (typeof options.format !== 'undefined') {
    return options.format({ kind: 'status', status, payload });
  }

  return DEFAULT_STATUS_FORMATTER(status, payload);
}

function patchStatusReplyMethod(reply: FastifyReply, options: PluginOptions) {
  const originalStatus = reply.status.bind(reply) as StatusReplyMethod;

  reply.status = function patchedStatus(code: number, payload?: unknown) {
    const response = originalStatus(code);

    if (arguments.length >= 2) {
      if (code === 204) {
        return response.send();
      }

      return response.send(formatStatusPayload(code, payload, options));
    }

    return response;
  } as StatusReplyMethod;
}

async function plugin(fastify: FastifyInstance, options: PluginOptions) {
  fastify.addHook('onRequest', (_, reply, done) => {
    patchStatusReplyMethod(reply, options);
    done();
  });

  /*
   * Obs.: the anonymous function must not be an arrow function,
   * probably because of the way the Fastify uses `this` context.
   */
  fastify.decorateReply('error', function (this: FastifyReply, status: number, error: ErrorOptions) {
    return this.status(status).send(formatErrorPayload(status, error, options));
  });
}

const feh = fp(plugin, {
  name: 'feh',
  fastify: '5.x',
});

export default feh;
