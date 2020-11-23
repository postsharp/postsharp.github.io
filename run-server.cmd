@ECHO OFF
REM To run from Windows:
REM  1. Install Ruby for Windows with RubyInstaller: https://jekyllrb.com/docs/installation/windows/
REM  2. In the Ruby prompt, do: gem install jekyll bundler
REM  3. Then run this script in a Ruby prompt
bundle exec jekyll server  --unpublished  %*
