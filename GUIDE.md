To add a new `node` type like `Question` for example: 
- add a new file to `src/nodes/Question.ts` 
- add `import Question from "./nodes/Question";` and `new Question(),` to `server.ts` 
- add `new Question(),` to `index.tsx` 
- add all stylings to `index.tsx` 

If you import it before basic stuff like paragraph, it'll supersede it _(i.e. when you hit ctrl-A + delete, it will be the default.) So, don't do that. I'm not sure why it behaves like that, but thats for another day really._