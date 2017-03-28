'use babel';
import GitHubApi from 'github';
import { CompositeDisposable } from 'atom';

const github = new GitHubApi({
  host: 'api.github.com',
  Promise: require('bluebird')
});

const constructRegexForDiffHunk = () => {
  let
  reFirst   ='.*?',reSecond  ='\\d+',reThird  ='.*?',
  reFourth  ='\\d+',reFifth  ='.*?',reSixth  ='(\\d+)';	// Integer Number 1
  return regProcessor = new RegExp(reFirst+reSecond+reThird+reFourth+reFifth+reSixth,["i"]);
}

const parseLineNumFromGitDiffHunk = diff_hunk => {
  var chunk = constructRegexForDiffHunk().exec(diff_hunk);
  if (chunk != null) {
      var int1=chunk[1];
      var intStr = int1.replace(/</,"&lt;");
      var intVal = Number.parseInt(intStr);
      if(!isNaN(intVal)){
        return intVal;
      }
  }
  return 0;
}
const toolTipTheme = () => {
  return "<div class='tooltip' role='tooltip'>"
             +"<div class='tooltip-arrow'></div>"
             +"<div class='tooltip-inner'"
             +"style='max-width: 300px !important;"
             +"white-space: normal !important; text-align: left'></div></div>";
}

const attachCommentToolTip = (commentValue,targetBufferRow) => {
  jQuery('[data-buffer-row="'+targetBufferRow+'"]').css('border-bottom','1px solid blue');
  disposable = atom.tooltips.add(
    jQuery('[data-buffer-row="'+targetBufferRow+'"]'),
    {
      title:commentValue,
      trigger: "click",
      placement: "bottom",
      template: toolTipTheme()
    }
  );
}

const constructAllCommentToolTips = tipArray => {
  jQuery.each(tipArray, function(targetlineNumber,commentString){
    if(typeof commentString != "undefined"){
      var targetBufferRow = targetlineNumber - 1;
      attachCommentToolTip(commentString,targetBufferRow);
    }
  });
  var noOfComments = tipArray.length;
  if(noOfComments < 1){
    atom.notifications.addInfo("There are No Review Comments ");
  }
}

const isCommentOutdated = oldPosition => {
  return (oldPosition == null);
}

const constructAllComments = (res) => {
  var tipArray = [];
  var currentFile = atom.workspace.getActiveTextEditor().getTitle();
  jQuery.each(res.data, function(){
    console.log("The File "+ this.path);
    if(!this.path.split('/').includes(currentFile)) {
      return true;
    }
    console.log("The git diff hunk "+ this.diff_hunk);
    var targetLine = this.original_position;
    targetLine += parseLineNumFromGitDiffHunk(this.diff_hunk);
    console.log('The Line '+targetLine);
    var outDatedLabel = (isCommentOutdated(this.position))?"[Outdated]":"";
    if(typeof tipArray[targetLine] != "undefined"
      && typeof tipArray[targetLine] != ""){
      tipArray[targetLine] += "";
    } else {

      tipArray[targetLine]  = " "+outDatedLabel+" Comment By @"+this.user.login+"<br>"+this.body;
    }
  });
  return tipArray;
}

const attachCommentToActiveTextEditor = res => {
  let editor;
  if (editor = atom.workspace.getActiveTextEditor()) {
    var allComments = constructAllComments(res)
    constructAllCommentToolTips(allComments);
  }
}
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
  if (creds === null) return false;
  const [githubUsername, githubAuthorizationToken] = creds;
  if (!githubAuthorizationToken) return false;
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
    }, (err, res) => {
        if(err) return err;
        attachCommentToActiveTextEditor(res);
        return res;
    });
};

const accessPullRequests = (res,repoOwner, repoName) => {
  var noOfPulls = 0;
  var firstPull = 0;
  if(typeof res != "undefined"){
    noOfPulls = res.data.length;
    firstPull = (typeof res.data[0] != "undefined")?res.data[0].number:0;
    if(noOfPulls > 0 && firstPull > 0){
      atom.notifications.addInfo("Pull Request Url: "+ res.data[0].html_url);
      fetchAllComments(noOfPulls,firstPull,repoOwner,repoName);
    }
  }
}

const fetchRepoUrl = () => {
  return atom.project.getRepositories()[0].repo.getConfigValue('remote.origin.url');
}

const fetchCurrentBranch = () => {
  return atom.project.getRepositories()[0].repo.getShortHead();
}

export default {
  async fetchAllPullRequests() {
    let repoUrl = fetchRepoUrl();
    const repoInfo = parseRepositoryInfoFromURL(repoUrl);
    if (!repoInfo) return;
    const [repoOwner, repoName] = repoInfo;
    if (!(repoOwner && repoName)) return;
    const branch = fetchCurrentBranch();
    await authenticate();
      console.log(repoOwner+'-'+repoName+'-'+branch);
      github.pullRequests.getAll({
          owner: repoOwner,
          repo: repoName,
          head: `${repoOwner}:${branch}`,
          state: 'open'
        }, function(err, res) {
          accessPullRequests(res,repoOwner,repoName);
      });
  }
};
