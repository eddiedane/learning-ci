import { app, server } from '../app';
import request from 'supertest';

describe('GET /', () => {
  afterAll((done) => {
    server.close();
    done();
  });

  it('responds with 200', async () => {
    await request(app).get('/').expect(200);
  });
});
