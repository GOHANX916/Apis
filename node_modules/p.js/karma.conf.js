/**
 * Copyright (C) 2014 yanni4night.com
 * karma.conf.js
 *
 * changelog
 * 2014-12-02[13:53:13]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: [
      'build/*.js'
    ]
  });
};