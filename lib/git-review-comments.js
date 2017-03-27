'use babel';

import GitReviewCommentsView from './git-review-comments-view';
import { CompositeDisposable } from 'atom';
import request from 'request';
import { fetchAllPullRequests } from './git-utils';

export default {

  subscriptions: null,
  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'git-review-comments:fetch': () => this.fetch()
    }));
  },
  deactivate() {
    this.subscriptions.dispose();
  },
  fetch() {
    console.log('fetching');
    fetchAllPullRequests()/*.then(console.log("fetch completed"))*/;
  }
};
