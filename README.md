###### — @zhaoworks/feh

Fastify reply helper for standardized status and error responses.

#### Features

- ✅ `reply.error(status, { message })`
- ✅ `reply.status(status, payload)` for string or JSON payloads
- ✅ Unified formatter with `kind` context (`error` or `status`)

#### Installation

```apache
λ bun add @zhaoworks/feh
```

#### Usage

```ts
import fastify from 'fastify';
import feh from '@zhaoworks/feh';

const app = fastify();

app.register(feh, {
  format: (input) => {
    if (input.kind === 'error') {
      return {
        ok: false,
        status: input.status,
        message: input.error.message,
      };
    }

    return {
      ok: true,
      status: input.status,
      data: input.payload,
    };
  },
});

app.get('/ok', (_, reply) => reply.status(200, { message: 'success' }));
app.get('/accepted', (_, reply) => reply.status(202, 'accepted'));
app.get('/error', (_, reply) => reply.error(500, { message: 'something went wrong' }));
```

#### API

- `reply.error(status, { message })`
- `reply.status(status, payload)`

`format(input)` receives:

- `{ kind: 'error', status, error }`
- `{ kind: 'status', status, payload }`

Use `format(input)` for all custom response formatting.

### License

[MIT](/LICENSE)
