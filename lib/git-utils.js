'use babel';
import GitHubApi from 'github';
import { CompositeDisposable } from 'atom';

const github = new GitHubApi({
    host: 'api.github.com',
    Promise: require('bluebird')
});

class PullRequestReviewComment {
    constructor() {}
    _constructRegexForDiffHunk = () => {
        let
            reFirst = '.*?',
            reSecond = '\\d+',
            reThird = '.*?',
            reFourth = '\\d+',
            reFifth = '.*?',
            reSixth = '(\\d+)'; // Integer Number 1
        return regProcessor = new RegExp(reFirst + reSecond + reThird + reFourth + reFifth + reSixth, ["i"]);
    }

    _parseLineNumFromGitDiffHunk = diff_hunk => {
        var chunk = this._constructRegexForDiffHunk().exec(diff_hunk);
        if (chunk != null) {
            var int1 = chunk[1];
            var intStr = int1.replace(/</, "&lt;");
            var intVal = Number.parseInt(intStr);
            if (!isNaN(intVal)) {
                return intVal;
            }
        }
        return 0;
    }
    _toolTipTheme = () => {
        return `<div class='tooltip' role='tooltip'>
              <div class='tooltip-arrow'></div>"
              <div class='tooltip-inner'"
              style='max-width: 300px !important;white-space: normal !important; text-align: left'></div>
            </div>`;
    }

    _attachCommentToolTip = (commentValue, targetBufferRow) => {
        jQuery('[data-buffer-row="' + targetBufferRow + '"]').css('border-bottom', '1px solid blue');
        disposable = atom.tooltips.add(
            jQuery('[data-buffer-row="' + targetBufferRow + '"]'), {
                title: commentValue,
                trigger: "click",
                placement: "bottom",
                template: this._toolTipTheme()
            }
        );
    }

    _constructAllCommentToolTips = tipArray => {
        let self = this;
        jQuery.each(tipArray, function(targetlineNumber, commentString) {
            if (typeof commentString != "undefined") {
                var targetBufferRow = targetlineNumber - 1;
                self._attachCommentToolTip(commentString, targetBufferRow);
            }
        });
        var noOfComments = tipArray.length;
        if (noOfComments < 1) {
            atom.notifications.addInfo("There are No Review Comments ");
        }
    }

    _isCommentOutdated = oldPosition => {
        return (oldPosition == null);
    }

    _constructAllComments = (res) => {
        var tipArray = [];
        var currentFile = atom.workspace.getActiveTextEditor().getTitle();
        let self = this;
        jQuery.each(res.data, function() {
            console.log("The File " + this.path);
            if (!this.path.split('/').includes(currentFile)) {
                return true;
            }
            console.log("The git diff hunk " + this.diff_hunk);
            var targetLine = this.original_position;
            targetLine += self._parseLineNumFromGitDiffHunk(this.diff_hunk);
            console.log('The Line ' + targetLine);
            var outDatedLabel = (self._isCommentOutdated(this.position)) ? "[Outdated]" : "";
            if (typeof tipArray[targetLine] != "undefined" && typeof tipArray[targetLine] != "") {
                tipArray[targetLine] += "";
            } else {

                tipArray[targetLine] = " " + outDatedLabel + " Comment By @" + this.user.login + "<br>" + this.body;
            }
        });
        return tipArray;
    }

    _attachCommentToActiveTextEditor = res => {
        let editor;
        if (editor = atom.workspace.getActiveTextEditor()) {
            var allComments = this._constructAllComments(res)
            this._constructAllCommentToolTips(allComments);
        }
    }
    _parseRepositoryInfoFromURL = url => {
        const matched = url.match(/github\.com[:\/](.*?)(\.git)?$/);
        return matched ? matched[1].split('/') : null;
    }

    _getGitHubCredentials = () => {
        let { githubAuthorizationToken, githubUsername } = atom.config.get('git-review-comments');
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

    _authenticate = () => {
        const creds = this._getGitHubCredentials();
        if (creds === null) return false;
        const [githubUsername, githubAuthorizationToken] = creds;
        if (!githubAuthorizationToken) return false;

        return github.authenticate({
            type: 'basic',
            username: githubUsername,
            password: githubAuthorizationToken
        });
    };

    _fetchAllComments = async(noOfPulls, firstPull, repoOwner, repoName) => {
        this._authenticate()
            .then(function() {
                github.pullRequests.getComments({
                    owner: repoOwner,
                    repo: repoName,
                    number: firstPull
                }, (err, res) => {
                    if (err) return err;
                    this._attachCommentToActiveTextEditor(res);
                    return res;
                });
            })
            .catch(console.error);
    };

    _accessPullRequests = (res, repoOwner, repoName) => {
        var noOfPulls = 0;
        var firstPull = 0;
        if (typeof res != "undefined") {
            noOfPulls = res.data.length;
            firstPull = (typeof res.data[0] != "undefined") ? res.data[0].number : 0;
            if (noOfPulls > 0 && firstPull > 0) {
                atom.notifications.addInfo("Pull Request Url: " + res.data[0].html_url);
                this._fetchAllComments(noOfPulls, firstPull, repoOwner, repoName);
            }
        }
    }

    _fetchRepoUrl = () => {
        return atom.project.getRepositories()[0].repo.getConfigValue('remote.origin.url');
    }

    _fetchCurrentBranch = () => {
        return atom.project.getRepositories()[0].repo.getShortHead();
    }

    async fetchAllPullRequests() {
        let repoUrl = this._fetchRepoUrl();
        const repoInfo = this._parseRepositoryInfoFromURL(repoUrl);
        if (!repoInfo) return;
        const [repoOwner, repoName] = repoInfo;
        if (!(repoOwner && repoName)) return;
        const branch = this._fetchCurrentBranch();
        await this._authenticate();
        console.log(repoOwner + '-' + repoName + '-' + branch);
        let self = this;
        github.pullRequests.getAll({
            owner: repoOwner,
            repo: repoName,
            head: `${repoOwner}:${branch}`,
            state: 'open'
        }, function(err, res) {
            self._accessPullRequests(res, repoOwner, repoName);
        });
    }
}

export default {
    PullRequestReviewComment
};
