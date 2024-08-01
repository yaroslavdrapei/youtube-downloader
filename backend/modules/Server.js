const http = require('node:http');

class Server {
  #server = http.createServer();
  constructor(port=3000, message='') {
    this.#server.listen(port, () => {
      if (message) console.log(message);
    });
  }

  async #getRequestBody(request) {
    return new Promise((resolve, reject) => {
      const body = [];

      request.on('data', data => body.push(data));
      request.on('end', () => resolve(Buffer.concat(body)));
      request.on('error', err => reject(err));
    });
  }

  post(url, callback) {
    this.#server.addListener('request', async (request, response) => {
      if (request.method === 'POST' && url === request.url) {
        const requestBody = await this.#getRequestBody(request);

        callback(requestBody, response);
      }
    });
  }
}

module.exports = Server;