import Layer from 'express/lib/router/layer.js';

/**
 * Express 4 does not handle errors from async request handlers: a rejected promise is never passed to the
 * error handlers (and crashes the server as an unhandled rejection). Patch request handling to forward
 * them to `next` (like Express 5 and the express-async-errors package do).
 */
Layer.prototype.handle_request = function handle(req, res, next) {
  const fn = this.handle;
  if (fn.length > 3) {
    // not a standard request handler
    return next();
  }

  try {
    const result = fn(req, res, next);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => next(err));
    }
  } catch (err) {
    next(err);
  }
};
