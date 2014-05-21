var ddoc = {
  _id: '_design/' + 'epochtalk-diffviewer',
  views: {},
  lists: {},
  shows: {}
};

module.exports = ddoc;

ddoc.views.posts = {
  map: function(doc) {
    if (doc.type === 'post') {
      emit(doc._id, doc);
    }
  }
};