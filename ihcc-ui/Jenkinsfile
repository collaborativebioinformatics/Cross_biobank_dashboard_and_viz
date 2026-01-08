def dockerHubRepo = "ihcc/ihcc-ui"
def githubRepo = "IHCC-cohorts/ihcc-ui"
def commit = "UNKNOWN"
def version = "UNKNOWN"

pipeline {
  agent any
  stages {
    stage('Prepare') {
      steps {
        script {
          commit = sh(returnStdout: true, script: 'git describe --always').trim()
        }
        script {
          version = sh(returnStdout: true, script: 'cat ./package.json | grep \\"version\\" | cut -d \':\' -f2 | sed -e \'s/"//\' -e \'s/",//\'').trim()
        }
      }
    }
    stage('Build container') {
      steps {
        sh "docker build -f Dockerfile . -t ${dockerHubRepo}:${commit}"
      }
    }
    stage('Pushes edge image') {
      when {
        branch "develop"
      }
      steps {
        withCredentials([usernamePassword(credentialsId:'ihcc_dockerhub_user', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
          sh 'docker login -u $USERNAME -p $PASSWORD'
          sh "docker tag ${dockerHubRepo}:${commit} ${dockerHubRepo}:edge"
          sh "docker push ${dockerHubRepo}:${commit}"
          sh "docker push ${dockerHubRepo}:edge"
        }
      }
    }
    stage('Pushes latest image') {
      when {
        branch "master"
      }
      steps {
        withCredentials([
          usernamePassword(credentialsId:'ihcc_dockerhub_user', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD'),
          usernamePassword(credentialsId:'github', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_PASSWORD'),
        ]) {
          sh "git tag ${version}"
          sh "git push https://${GITHUB_USERNAME}:${GITHUB_PASSWORD}@github.com/${githubRepo} --tags"
          sh 'docker login -u $DOCKERHUB_USERNAME -p $DOCKERHUB_PASSWORD'
          sh "docker tag ${dockerHubRepo}:${commit} ${dockerHubRepo}:latest"
          sh "docker tag ${dockerHubRepo}:${commit} ${dockerHubRepo}:${version}"
          sh "docker push ${dockerHubRepo}:latest"
          sh "docker push ${dockerHubRepo}:${version}"
        }
      }
    }
  }
}
