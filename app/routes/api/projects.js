"use strict";

const Router = require('koa-router');
const Project = require('mongoose').model('Project');
const Participant = require('mongoose').model('Participant');
const bodyParser = require('koa-body')();
const auth = require(__dirname + '/../../auth');

module.exports = function (apiRouter) {

  const projectRouter = new Router({ prefix: '/projects' });

  projectRouter.get('/', auth.ensureAuthenticated, auth.ensureUser, function *() {
    try {
      const myProjects = yield Participant.find({ user: this.user }, { project: 1 }).lean().exec();
      const ids = myProjects.map(function(single) {
        return single.project;
      });
      // TODO Needs a bit more control over what kind of data is populated
      // Full user objects might not be needed. It could be enough to get:
      // _id, name and email (not sure of last one is really needed here)
      // Limiting amout of loaded data should be a wise choice
      const projects = yield Project.find({ _id: { $in: ids } }).populate([{
        path: 'creator',
        model: 'User'
      },{
        path: 'owner',
        model: 'User'
      },{
        path : 'participants',
        model: 'Participant',
        populate: {
          path: 'user',
          model: 'User'
        }
      }]).exec();
      this.status = 200;
      this.body = {
        data: projects
      };
    } catch(err) {
      console.log(err);
      this.throw(500, 'internal_server_error');
    }
  });

  projectRouter.get('/:project', auth.ensureAuthenticated, auth.ensureUser, function *() {
    this.throw(501, 'not_implemented');
  });

  projectRouter.post('/', auth.ensureAuthenticated, auth.ensureUser, bodyParser, function *() {
    if ( !(this.request.body.title && this.request.body.title.trim() && this.request.body.start) ) {
      this.throw(400, 'required_parameter_missing');
      return;
    }

    const title = this.request.body.title.trim();
    const start = new Date(this.request.body.start);
    const end = this.request.body.end ? new Date(this.request.body.end) : undefined;

    if ( end && end < start ) {
      this.throw(400, 'end_date_before_start');
      return;
    }

    try {
      let project = new Project({
        title: title,
        start: start,
        end: end,
        creator: this.user._id,
        owner: this.user._id,
        participants: []
      });

      project = yield project.save();

      let participant = new Participant({
        user: this.user._id,
        project: project._id,
        status: 'active'
      });

      participant = yield participant.save();

      project.participants = [participant._id];

      project = yield project.save();
      // TODO Needs a bit more control over what kind of data is populated
      // Full user objects might not be needed. It could be enough to get:
      // _id, name and email (not sure of last one is really needed here)
      // Limiting amout of loaded data should be a wise choice
      project = yield Project.populate(project, [{
        path: 'creator',
        model: 'User'
      },{
        path: 'owner',
        model: 'User'
      },{
        path : 'participants',
        model: 'Participant',
        populate: {
          path: 'user',
          model: 'User'
        }
      }]);

      this.status = 200;
      this.body = {
        data: project
      };
    } catch(err) {
      console.log('Create project', err);
      this.throw(500, 'creation_failed');
    }
  });

  projectRouter.put('/:project', auth.ensureAuthenticated, auth.ensureUser, function *() {
    this.throw(501, 'not_implemented');
  });

  projectRouter.delete('/:project', auth.ensureAuthenticated, auth.ensureUser, function *() {
    this.throw(501, 'not_implemented');
  });

  projectRouter.get('/:project/join', auth.ensureAuthenticated, auth.ensureUser, function *() {
    this.throw(501, 'not_implemented');
  });

  projectRouter.get('/:project/leave', auth.ensureAuthenticated, auth.ensureUser, function *() {
    this.throw(501, 'not_implemented');
  });

  apiRouter.use('', projectRouter.routes(), projectRouter.allowedMethods());
};
