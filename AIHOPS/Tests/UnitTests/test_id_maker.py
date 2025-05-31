import threading
import time

from Domain.src.DS.IdMaker import IdMaker


def test_sequence_and_reuse():
    maker = IdMaker()
    assert maker.next_id() == 0
    assert maker.next_id() == 1            # sequential

    maker.remove_obj(0)                    # reuse a freed id
    assert maker.next_id() == 0

    maker.start_from(10)                   # jump to a higher range
    assert maker.next_id() == 10


def _worker(id_maker, bucket, n):
    for _ in range(n):
        bucket.append(id_maker.next_id())


def test_thread_safety():
    """test that no duplicates appear under concurrency."""
    maker = IdMaker()
    results: list[int] = []

    ths = [threading.Thread(target=_worker, args=(maker, results, 200))
           for _ in range(4)]
    for t in ths:
        t.start()
    for t in ths:
        t.join()

    assert len(results) == len(set(results))

