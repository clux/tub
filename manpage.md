# tub(1)
Parse TAP sources from stdin

## SYNOPSIS
`tub [-a]`

## DESCRIPTION
Reads TAP from stdin and prints the summary.

## EXAMPLES
Summary only via nodeunit

`nodeunit test/ --reporter=tap | tub`

Summary + prettified TAP via tap

`tap test/ | tub -a`

## INSTALLATION
Install globally through npm

`npm install -g tub`

## BUGS
Please report bugs [https://github.com/clux/tub/issues](https://github.com/clux/tub/issues)
