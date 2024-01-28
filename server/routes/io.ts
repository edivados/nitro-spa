export default eventHandler(event => {
  useSocketIOServer().handler(event);
  event._handled = true;
});
