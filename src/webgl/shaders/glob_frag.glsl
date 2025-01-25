#version 300 es
precision highp float;
in vec2 f_uv;
out vec4 o_color;
uniform sampler2D u_density;
uniform sampler2D u_background;
uniform float u_time;
void main(){
    vec3 lightDir = normalize(vec3(-1.0, -1.0, -0.5));
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 halfVector = normalize(-lightDir + viewDir);
    vec3 value = texture(u_density, f_uv).rgb;
    float delta = 0.025;
    if(value.r < 0.5){
        discard;
    }
    vec3 sample2x = texture(u_density, f_uv + vec2(delta, 0.0)).rgb;
    vec3 sample2y = texture(u_density, f_uv + vec2(0.0,delta)).rgb;
    vec3 gradient = normalize(vec3(value.r - sample2x.r, value.r - sample2y.r, 0.5));
    vec3 bg = texture(u_background, (f_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0)) + gradient.xy / 100.0 ).rgb;
    float diffuse = dot(gradient, -lightDir);
    if(diffuse < 0.0){
        diffuse = 0.0;
    }
    float spec = dot(gradient, halfVector);
    if (spec < 0.0){
        spec = 0.0;
    }
    spec = pow(spec, 1000.0);

    if (value.r < 0.55){
        spec = 1.0;
    }
    vec3 color = vec3(sin(f_uv.x * 3.14 * 8.0 + f_uv.y + u_time), sin(f_uv.y * f_uv.x * 3.14 * 7.0 + 4.0 * f_uv.x + u_time), sin(f_uv.x * 3.14 * 7.0 + 6.0 + u_time));
    // color.r = 1.0;
    //diffuse * 0.5 + 0.5 * (1.0 - dot(gradient, viewDir))
    o_color = vec4( mix(bg, normalize(abs(color))* (diffuse + spec + 0.1), diffuse * 0.5 + 0.5 * (1.0 - dot(gradient, viewDir))), 1.0);
}