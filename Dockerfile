FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remover os arquivos padrão do Nginx, para adicionar o do TechJobs e não ter o de exemplo do Nginx
RUN rm -rf ./*

COPY html /usr/share/nginx/html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY imgs /usr/share/nginx/html/imgs

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]