# git-review-comments package

Atom IDE Package to retrieve git review comments line by line.

### Current Status (V 0.0.2)
*   Integrated with Git using npm package [github]
*   Get Git Config From Atom Git Repos
*   Fetch Pull Request Comments And Display Near Line Number
![This is how it works V 0.0.2](https://drive.google.com/file/d/0BzSV5K2CcruzaElaMGl1dFpUWXM/preview)

### V 0.0.1
*   This is initial commit for Atom IDE Package
*   This is generated using command ```Package Generator:
Generate Package``` in Command Palette
*   For Demo of Generic Atom Package we have implemented
below feature [Refer Tutorial](https://github.com/blog/2231-building-your-first-atom-plugin)
*   Fetch Html of Any url - Screenshot taken from [Tutorial](https://github.com/blog/2231-building-your-first-atom-plugin)

 ![A demo of  package V 0.0.1](https://cloud.githubusercontent.com/assets/6755555/17759384/836ea91c-64ab-11e6-8fbe-7d15fb482c6d.gif)


### Requirements
*   [APM](https://atom.io/): Atom Package Manager command  line tool

    You can install apm by opening Atom and navigating to Atom > Install Shell Commands in the application menu.
    Check APM using apm -v

*   [Node.js](http://nodejs.org): for all the magic

    Nodejs is necessary for bower, gulp, and all the extra modules you might need.

### How to proceed
*   Clone
*   Check Requirements: ```apm -v```
*   Install dependencies ```npm i```
*   Open the Command Palette ```Cmd+Shift+P```
*   Run ```Window: Reload```
*   Go To Package Settings to Configure Git Username and [Token](https://github.com/settings/tokens/new)

### Reference
* [Node Github Api](https://mikedeboer.github.io/node-github/#api-pullRequests-getReviewComments)
* [Github API](https://developer.github.com/v3/pulls/)
* [Atom IDE Tutorial](https://github.com/blog/2231-building-your-first-atom-plugin)

![A screenshot of your package](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)
