#version 300 es
precision highp float;
in vec2 f_uv;
out vec4 o_color;
uniform sampler2D u_density;
void main(){
    vec3 color = texture(u_density, f_uv).rgb;
    if(color.r < 0.5){
        discard;
    }
    color.r = 1.0;
    o_color = vec4(color, 1.0);
}