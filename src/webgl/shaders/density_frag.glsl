#version 300 es
precision highp float;
in vec2 v_pos;
in vec2 v_center;
in vec2 v_radius;
in vec3 v_color;
out vec4 o_color;
void main(){
    float dst = length(v_pos - v_center);
    float value = 0.0;
    float v_r_inner = v_radius.x;
    float v_r_outer = v_radius.y;
    if (dst < v_r_inner){
        value = cos(dst / v_r_inner * 3.14159 / 2.0) * 0.5 + 0.5;
    } else if(dst < v_r_outer){
        value = cos(((dst - v_r_inner) / (v_r_outer - v_r_inner) + 1.0) * 3.14159 / 2.0) * 0.5 + 0.5;
    }
    o_color = vec4(v_color * value, value);
}