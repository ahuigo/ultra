dev:
	deno task dev

.PHONY: test
test:
	deno task test 

clean:
	rm -rf test/fixture/output
	rm -rf examples/hdmap-ui/.ultra/
	rm -rf test/fixture/.ultra

fmt:
	deno fmt .