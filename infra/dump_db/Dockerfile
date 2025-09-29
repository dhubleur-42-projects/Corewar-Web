FROM postgres:16 as dump

RUN apt-get update && apt-get install -y curl unzip && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

WORKDIR /app
COPY dump.sh /app/dump.sh
COPY anonymize.sql /app/anonymize.sql

RUN chmod +x /app/dump.sh

CMD ["/app/dump.sh"]