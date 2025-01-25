// @ts-check
import { line, arc, project } from "./collision.js";


let lineData = [ [200, 300], [100, 100]];
let arcData = [300, 200, 50, 0, Math.PI];
let myLine = line(lineData[0], lineData[1]);
let myArc = arc([arcData[0], arcData[1]], arcData[2], arcData[3], arcData[4]);
let canvas = document.createElement("canvas");
document.body.appendChild(canvas);
let ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;
let mx = 0;
let my = 0;
canvas.addEventListener("mousemove", (e) => {
    mx = e.clientX - canvas.getBoundingClientRect().x;
    my = e.clientY - canvas.getBoundingClientRect().y;
    // console.log("Hi")
})

let draw = () => {
    if(ctx){
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle ="red";
        const ms = 3;
        ctx.fillRect(mx - ms, my - ms, ms * 2, ms * 2);

        // ctx.beginPath();
        // ctx.moveTo(lineData[0][0], lineData[0][1]);
        // ctx.lineTo(lineData[1][0], lineData[1][1]);
        // ctx.stroke();

        // let nearest = myLine.nearestPoint([mx, my]);
        // ctx.fillStyle="green";
        // ctx.fillRect(nearest[0] - ms, nearest[1] - ms, ms * 2, ms * 2);

        // ctx.fillText(`${myLine.distance([mx, my])}`, 0, 100);

        let r = 25;

        ctx.beginPath();
        ctx.arc(arcData[0], arcData[1], arcData[2], arcData[3], arcData[4])
        ctx.stroke();

        ctx.fillStyle = myArc.collideCircle([mx, my], r) ? "blue" : "red";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();

         let nearest = myArc.nearestPoint([mx, my]);
        ctx.fillStyle="green";
        ctx.fillRect(nearest[0] - ms, nearest[1] - ms, ms * 2, ms * 2);

    }
    requestAnimationFrame(draw);

}
requestAnimationFrame(draw);