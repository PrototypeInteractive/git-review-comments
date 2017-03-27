'use babel';
import GitHubApi from 'github';
import { CompositeDisposable } from 'atom';

const github = new GitHubApi({
  host: 'api.github.com',
  Promise: require('bluebird')
});

const parseRepositoryInfoFromURL = url => {
  const matched = url.match(/github\.com[:\/](.*?)(\.git)?$/);
  return matched ? matched[1].split('/') : null;
}

const getGitHubCredentials = async() => {
  let {githubAuthorizationToken,githubUsername} = atom.config.get('git-review-comments');

  if (githubUsername === '') {
    githubUsername = process.env.GITHUB_USERNAME;
    githubAuthorizationToken = process.env.GITHUB_ACCESS_TOKEN;
  }

  if (typeof githubUsername === 'undefined') {
    atom.notifications.addError('username not defined');
    return null;
  }

  return [githubUsername, githubAuthorizationToken];
};

const authenticate = async() => {
  const creds = await getGitHubCredentials();

  if (creds === null) {
    return false;
  }
  const [githubUsername, githubAuthorizationToken] = creds;
  console.log(creds);

  if (!githubAuthorizationToken) {
    return false;
  }

  github.authenticate({
    type: 'basic',
    username: githubUsername,
    password: githubAuthorizationToken
  })
  return true;
};

const fetchAllComments = async(noOfPulls,firstPull,repoOwner,repoName) => {
    await authenticate();
    github.pullRequests.getComments({
      owner: repoOwner,
      repo: repoName,
      number: firstPull
    }, function(err, res) {
      if(err){
          return err;
      }
      let editor;
      if (editor = atom.workspace.getActiveTextEditor()) {
        var tootlTipHtml = "<div class='tooltip' role='tooltip'>"
                   +"<div class='tooltip-arrow'></div>"
                   +"<div class='tooltip-inner'"
                   +"style='max-width: 300px !important;"
                   +"white-space: normal !important; text-align: left'></div></div>";
        var tipArray = [];
        var currentFile = atom.workspace.getActiveTextEditor().getTitle();
        jQuery.each(res.data, function(){
          console.log("The File "+ this.path);
          if(!this.path.split('/').includes(currentFile)) {
            return true;
          }
          console.log('The Line '+this.original_position);
          if(typeof tipArray[this.original_position] != "undefined"
            && typeof tipArray[this.original_position] != ""){
            tipArray[this.original_position] += "";
          } else {
            tipArray[this.original_position]  = "Comment By @"+this.user.login+"<br>"+this.body;
          }
        });
        jQuery.each(tipArray, function(index,value){
          if(typeof value != "undefined"){
            var targetlineNumber = index;
            var targetBufferRow = index - 1;
            jQuery('[data-buffer-row="'+targetBufferRow+'"]').css('border-bottom','1px solid blue');
            disposable = atom.tooltips.add(
              jQuery('[data-buffer-row="'+targetBufferRow+'"]'),
              {
                title:value,
                trigger: "click",
                placement: "bottom",
                template: tootlTipHtml
              }
            );
          }
        });
      }
      return res;
    });
};

export default {
  async fetchAllPullRequests() {
    const remoteUrl = atom.project.getRepositories()[0].repo.getConfigValue('remote.origin.url');
    const repoInfo = parseRepositoryInfoFromURL(remoteUrl);
    if (!repoInfo) {
      return;
    }

    const [repoOwner, repoName] = repoInfo;
    if (!(repoOwner && repoName)) {
      return;
    }
    const branch = atom.project.getRepositories()[0].repo.getShortHead();
    await authenticate();
      console.log(repoOwner+'-'+repoName+'-'+branch);
      var noOfPulls = 0;
      var firstPull = 0;
      github.pullRequests.getAll({
          owner: repoOwner,
          repo: repoName,
          head: `${repoOwner}:${branch}`,
          state: 'open'
        }, function(err, res) {
          if(typeof res != "undefined"){
            noOfPulls = res.data.length;
            firstPull = (typeof res.data[0] != "undefined")?res.data[0].number:0;
            console.log("no of pulls: "+ noOfPulls);
            console.log("Only One Pull Per User Per Branch - Pull number " + firstPull);
            if(noOfPulls > 0 && firstPull > 0){
              atom.notifications.addInfo("Pull Request Url: "+ res.data[0].html_url);
              fetchAllComments(noOfPulls,firstPull,repoOwner,repoName);
            }
          }
      });
  }
};
