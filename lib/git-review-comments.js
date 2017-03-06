'use babel';

import GitReviewCommentsView from './git-review-comments-view';
import { CompositeDisposable } from 'atom';
import request from 'request'
import GitHubApi from 'github'

//Configuring github api. This will be used along with Atom Github api
const github = new GitHubApi({
  version: '3.0.0',
  host: atom.config.get('github-utils.githubEnterpriseEndpoint') || 'api.github.com',
  pathPrefix: atom.config.get('github-utils.githubEnterprisePathPrefix') || null
});

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
    //Demo on modifying editor
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      this.download(selection).then((html) => {
        editor.insertText(html)
      }).catch((error) => {
        atom.notifications.addWarning(error.reason)
      })
    }
  },
  download(url) {
    return new Promise((resolve,reject) => {
      request(url, (error, response, body) => {
        if(!error && response.statusCode == 200){
          resolve(body)
        } else {
          reject({
            reason : 'Unable to download page'
          })
        }
      })
    })
  }
};
