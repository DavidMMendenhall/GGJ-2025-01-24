#version 300 es
uniform mat3 camera;
in vec2 pos;
in vec2 center;
in vec2 radius;
in mat3  model;
in vec3 color;
out vec2 v_pos;
out vec3 v_color;
out vec2 v_center;
out vec2 v_radius;
void main(){
    v_pos = (model * vec3(pos, 1.0)).xy;
    v_center = (vec3(center, 1.0)).xy;
    v_radius = radius;
    v_color = color;
    gl_Position = vec4(camera * model * vec3(pos, 1.0), 1.0);
}