.PHONY: test
test:
	cd examples/basic && deno test -A && \
	cd ../with-csr && deno test -A && \
	cd ../with-unocss && deno test -A 

