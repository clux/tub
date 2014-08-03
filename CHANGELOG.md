0.3.1 / 2014-08-03
==================
  * Fixed the `strict` option's errors getting lost in the ether
  * Tub's onFinish now conforms to standard node error style `(err, res) -> {}`
    - **BREAKS API** before there was only the `res` parameters in the callback
  * Documentation and coverage added
  * Remove reliance on tap for CLI: `tub` assumes `tap` is present in `$(npm bin)` at cwd

0.2.0 / 2013-04-03
==================
  * Fixed an issue were we would stop reading from tub in bin file
  * New dependency `dev-null`

0.1.4 / 2013-04-03
==================
  * Add `strict` option

0.1.2 / 2013-03-14
==================
  * Documentation and tweaks

0.1.1 / 2013-03-11
==================
  * Allow number-less tap output

0.1.0 / 2013-03-11
==================
  * Initial version
