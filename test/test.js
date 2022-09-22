const app = require("../app");
const request = require("supertest");

describe("GET /", () => {
  it("responds with 200", async () => {
    return request(app).get("/").expect(400);
  });
});
