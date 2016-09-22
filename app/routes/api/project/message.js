"use strict";

const Router = require('koa-router');
const Message = require('mongoose').model('Message');
const Auth = require(__dirname + '/../../../auth');
const Middleware = require(__dirname + '/../../../lib/middleware');
const bodyParser = require('koa-body')();

module.exports = function (projectRouter) {

  const messagePopulateOptions = [{
    path: 'creator',
    model: 'User'
  }];

  const messageRouter = new Router({ prefix: '/:project/messages' });

  messageRouter.get('/', Auth.ensureAuthenticated, Auth.ensureUser, Middleware.ensureActiveProjectParticipant, function *() {
    try {
      const messages = yield Message.find({ project: this.params.project }).sort({ created: -1 }).populate(messagePopulateOptions).exec();

      this.apiRespond(messages);
    } catch (err) {
      console.error(err);
      this.throw(500, 'internal_server_error');
    }
  });

  messageRouter.post('/', Auth.ensureAuthenticated, Auth.ensureUser, Middleware.ensureActiveProjectParticipant, bodyParser, function *() {
    if ( !( this.request.body.message && this.request.body.message.trim() ) ) {
      this.throw(400, 'required_parameter_missing');
      return;
    }

    try {
      let message = new Message({
        message: this.request.body.message.trim(),
        creator: this.user._id,
        project: this.params.project,
      });

      message = yield message.save();

      message = yield Message.populate(message, messagePopulateOptions);

      this.emitApiAction('create', 'message', message, this.user);

      this.apiRespond(message);
    } catch(err) {
      console.error(err);
      if ( err.errors && err.errors.message && err.errors.message.kind === 'maxlength' ) {
        this.throw(400, 'message_is_too_long');
        return;
      }
      this.throw(500, 'creation_failed');
    }
  });

  projectRouter.use('', messageRouter.routes(), messageRouter.allowedMethods());
};