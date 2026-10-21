// Declarative pipeline. Runs inside the official Playwright image so browsers
// and OS dependencies are already installed (requires the Docker Pipeline plugin).
// Reports are published with the HTML Publisher and JUnit plugins.
pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.56.0-noble'
      args '--ipc=host'
    }
  }

  parameters {
    choice(name: 'PROJECT', choices: ['all', 'chromium', 'firefox', 'webkit', 'api', 'mobile', 'performance'], description: 'Which test project to run')
    string(name: 'GREP', defaultValue: '', description: 'Tag filter, e.g. @smoke or @regression')
    string(name: 'WORKERS', defaultValue: '2', description: 'Parallel workers')
  }

  triggers {
    cron('H 1 * * *') // nightly regression
  }

  environment {
    CI = 'true'
    TEST_ENV = 'prod'
    WORKERS = "${params.WORKERS}"
    HOME = "${env.WORKSPACE}"
  }

  options {
    timestamps()
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm install'
        sh 'npm run typecheck'
      }
    }

    stage('Test') {
      steps {
        script {
          def projectArgs = [
            'all'        : '--project=api --project=chromium --project=firefox --project=webkit',
            'mobile'     : '--project=mobile-chrome --project=mobile-safari',
            'performance': '--project=performance',
          ][params.PROJECT] ?: "--project=${params.PROJECT}"
          def grepArg = params.GREP?.trim() ? "--grep \"${params.GREP.trim()}\"" : ''
          sh "npx playwright test ${projectArgs} ${grepArg}"
        }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
      publishHTML(target: [
        reportDir            : 'playwright-report',
        reportFiles          : 'index.html',
        reportName           : 'Playwright Report',
        keepAll              : true,
        alwaysLinkToLastBuild: true,
        allowMissing         : true,
      ])
      archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
    }
  }
}
