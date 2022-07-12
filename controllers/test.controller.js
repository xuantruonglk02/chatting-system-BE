function test(req, res) {
  return res.json({
    success: 1,
    func: 'test'
  });
}

module.exports = {
  test
}
