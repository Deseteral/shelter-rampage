# Shelter Rampage
My game for the [Gynvael's Summer GameDev Challenge 2018](https://gynvael.coldwind.pl/?id=686).
You can play it [here](https://deseteral.github.io/shelter-rampage/)!

The game is distributed as a single `index.htm` file located in `./dist` directory.

![Screenshot](/tools/screenshot.png?raw=true "Screenshot")

## Instructions
Use `WASD` to move, look around using mouse and shoot using `LEFT MOUSE BUTTON` or `SPACE`.

Your job is to clear the floor from enemies. When you do that you will proceed to the next floor.

Bullets and enemies hits can hurt you. Your health is represented in top-left corner of the screen.

Your gun has unlimited ammo but shotting can overheat it - when that happens you will have to wait for it to cool down.
Your gun's temperature is represented in bottom-left part of the screen.

Killing enemies will charge your special ability. When fully charged you can activate it by pressing `F` key. Activated ability lasts for a couple of seconds and gives you both immortality and faster shooting speed. You can check charging status in bottom-right part of the screen.

Try to beat your own highscore or challenge your friends!

## Building
To build the game on your own you have to run:
```
npm i
npm run build
```

### Publishing to GitHub Pages
Run `npm run upload`.

## License
This game is licensed under the [MIT license](LICENSE).
