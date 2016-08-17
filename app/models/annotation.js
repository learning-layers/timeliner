"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
let annotationSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    start: { type: Date, required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    created: Date,
    updated: Date
  },
  {
    toJSON : {
      transform: function (doc, ret) {
        delete ret.__v;
      }
    }
  });

annotationSchema.pre('save', function(done) {
  const currentDate = new Date();

  this.updated = currentDate;

  if (!this.created){
    this.created = currentDate;
  }

  done();
});

const Annotation = mongoose.model('Annotation', annotationSchema);

module.exports = Annotation;
