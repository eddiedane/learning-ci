const supertest = require("supertest");
const assert = require("assert");

const server = supertest.agent("http://localhost:5050");

describe("SAMPLE unit test", () => {
  it("should return homepage", (done) => {
    server.get("/").end((err, res) => {
      assert.equal(res.status, 400);
      done();
    });
  });
});
