"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
let activitySchema = new Schema({
    activityType: { type: String, required: true },
    objectType: { type: String, required: true },
    data: Schema.Types.Mixed,
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    created: { type: Date, index: true }
  },
  {
    toJSON : {
      transform: function (doc, ret) {
        delete ret.__v;
      }
    }
  });

activitySchema.pre('save', function(done) {
  const currentDate = new Date();

  if (!this.created){
    this.created = currentDate;
  }

  done();
});

activitySchema.statics.getPopulateOptions = function() {
  return [{
    path: 'actor',
    model: 'User'
  },
  {
    path: 'data.user',
    model: 'User'
  }];
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
