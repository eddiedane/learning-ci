import express from 'express';

const app = express();
const port = 5050;

app.get('/', (req, res, next) => {
  res.json({ name: 'CI-CD' });
});

const server = app.listen(port, () =>
  // tslint:disable:no-console
  console.log(`App listening on port ${port}!`),
);

export { app, server };
