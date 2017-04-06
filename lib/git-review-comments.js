'use babel';

import GitReviewCommentsView from './git-review-comments-view';
import { CompositeDisposable } from 'atom';
import request from 'request';
import { fetchAllPullRequests,PullRequestReviewComment } from './git-utils';


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
    new PullRequestReviewComment().fetchAllPullRequests();
  },
  config: {
      githubUsername: {
        title: 'GitHub username',
        type: 'string',
        default: '',
        description: 'If not provided, will try to take from `process.env.GITHUB_USERNAME`',
        order: 0
      },
      githubAuthorizationToken: {
        title: 'GitHub authorization token',
        type: 'string',
        default: '',
        description: 'Required to view pull requests made within private repositories. Generate from here https://github.com/settings/tokens/new',
        order: 1
      }
  }
};
