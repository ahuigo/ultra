.PHONY: test
test:
	deno test --allow-all --no-lock ./test/unit && \
	cd test/fixture && deno test --no-lock --allow-all && \
	cd ../../examples/basic && deno test -A && \
	cd ../with-csr && deno test -A && \
	cd ../with-unocss && deno test -A 

