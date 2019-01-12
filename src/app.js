import server from './websocket-server';
import configs from './configs';

const { port } = configs;

server.listen(port, () => {
  console.log(`http/ws server listening on ${port}`);
});
