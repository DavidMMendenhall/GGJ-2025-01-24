#version 300 es
in vec2 pos;
out vec2 f_uv;
void main(){
    f_uv = (pos + 1.0) / 2.0;// convert screen space to texture space
    gl_Position = vec4(pos, 0.0, 1.0);
}