export function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400;
  if (err.code === 'ENOENT') {
    status = 404;
    message = 'File not found';
  }
  if (err.code === 11000) {
    status = 409;
    message = `Duplicate value: ${Object.keys(err.keyValue || {}).join(', ') || 'record already exists'}`;
  }
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}
