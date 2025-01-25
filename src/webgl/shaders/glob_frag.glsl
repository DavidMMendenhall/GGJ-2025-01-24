#version 300 es
precision highp float;
in vec2 f_uv;
out vec4 o_color;
uniform sampler2D u_density;
void main(){
    vec3 color = texture(u_density, f_uv).rgb;
    o_color = vec4(color, 1.0);
}`