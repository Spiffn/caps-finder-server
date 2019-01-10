import server from './websocket-server';

const port = process.env.PORT || 8081;

server.listen(port, () => {
  console.log(`http/ws server listening on ${port}`);
});
