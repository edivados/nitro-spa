export default eventHandler(event => {
  useSocketIOServer().handler(event);
});
