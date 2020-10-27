---
id: 587d824a367417b2b2512c45
title: Anonymous Message Board
challengeType: 4
forumTopicId: 301568
---

## Description

<section id='description'>

Build a full stack JavaScript app that is functionally similar to this: <https://anonymous-message-board.freecodecamp.rocks/>.

Working on this project will involve you writing your code on Repl.it on our starter project. After completing this project you can copy your public Repl.it URL (to the homepage of your app) into this screen to test it! Optionally you may choose to write your project on another platform but it must be publicly visible for our testing.

Start this project on Repl.it using [this link](https://repl.it/github/freeCodeCamp/boilerplate-project-messageboard) or clone [this repository](https://github.com/freeCodeCamp/boilerplate-project-messageboard/) on GitHub! If you use Repl.it, remember to save the link to your project somewhere safe!

</section>

## Instructions

<section id='instructions'>

</section>

## Tests

<section id='tests'>

```yml
tests:
  - text: I can provide my own project, not the example URL.
    testString: |
      getUserInput => {
        assert(!/.*\/anonymous-message-board\.freecodecamp\.rocks/.test(getUserInput('url')));
      }
  - text: Only allow your site to be loading in an iFrame on your own pages.
    testString: ''
  - text: Do not allow DNS prefetching.
    testString: ''
  - text: Only allow your site to send the referrer for your own pages.
    testString: ''
  - text: I can POST a thread to a specific message board by passing form data text and deletepassword\_ to /api/threads/{board}.(Recommend res.redirect to board page /b/{board}) Saved will be at least \_id, text, createdon\_(date&time), bumpedon\_(date&time, starts same as created\_on), reported(boolean), deletepassword\_, & replies(array).
    testString: ''
  - text: I can POST a reply to a thread on a specific board by passing form data text, deletepassword\_, & threadid\_ to /api/replies/{board} and it will also update the bumped\_on date to the comments date.(Recommend res.redirect to thread page /b/{board}/{thread\_id}) In the thread's replies array will be saved \_id, text, createdon\_, deletepassword\_, & reported.
    testString: ''
  - text: I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies each from /api/threads/{board}. The reported and deletepasswords\_ fields will not be sent to the client.
    testString: ''
  - text: I can GET an entire thread with all its replies from /api/replies/{board}?thread\_id={thread\_id}. Also hiding the same fields the client should be see.
    testString: ''
  - text: I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the threadid\_ & deletepassword\_. (Text response will be 'incorrect password' or 'success')
    testString: ''
  - text: I can delete a post(just changing the text to '[deleted]' instead of removing completely like a thread) if I send a DELETE request to /api/replies/{board} and pass along the threadid\_, replyid\_, & deletepassword\_. (Text response will be 'incorrect password' or 'success')
    testString: ''
  - text: I can report a thread and change its reported value to true by sending a PUT request to /api/threads/{board} and pass along the threadid\_. (Text response will be 'success')
    testString: ''
  - text: I can report a reply and change its reported value to true by sending a PUT request to /api/replies/{board} and pass along the threadid\_ & replyid\_. (Text response will be 'success')
    testString: ''
  - text: Complete functional tests that wholly test routes and pass.
    testString: ''

```

</section>

## Challenge Seed

<section id='challengeSeed'>

</section>

## Solution

<section id='solution'>

```js
/**
  Backend challenges don't need solutions, 
  because they would need to be tested against a full working project. 
  Please check our contributing guidelines to learn more.
*/
```

</section>
